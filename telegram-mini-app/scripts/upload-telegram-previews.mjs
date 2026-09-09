import { createInterface } from 'node:readline/promises';
import { stat, readFile, writeFile, readdir } from 'node:fs/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import { TelegramClient, Api, utils } from 'teleproto';
import { StringSession } from 'teleproto/sessions/index.js';
import { CustomFile } from 'teleproto/client/uploads.js';

const BOT_USERNAME = 'tankua_tma_bot';
const MEDIA_DIR = path.resolve('preview-media');
const SESSION_FILE = path.resolve('.telegram-preview.session');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const dryRun = process.argv.includes('--dry-run');

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value || value === 'your_secret_hash' || value === '12345678') {
    throw new Error(`${name} is missing or still contains the example value.`);
  }
  return value;
}

async function mediaFiles() {
  let entries;
  try {
    entries = await readdir(MEDIA_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Create ${MEDIA_DIR} and add 01-home.png through 05-confirmation.png.`);
    }
    throw error;
  }
  const files = entries
    .filter(entry => entry.isFile() && ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map(entry => path.join(MEDIA_DIR, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b), 'en', { numeric: true }));
  if (!files.length) throw new Error(`No JPG, PNG, or WebP screenshots found in ${MEDIA_DIR}.`);
  if (files.length > 10) throw new Error('Telegram accepts at most 10 preview items.');
  return files;
}

async function loadSession() {
  try {
    return (await readFile(SESSION_FILE, 'utf8')).trim();
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function uploadPhoto(client, filePath) {
  const details = await stat(filePath);
  const uploadedFile = await client.uploadFile({
    file: new CustomFile(path.basename(filePath), details.size, filePath),
    workers: 1,
  });
  const uploadedMedia = await client.invoke(new Api.messages.UploadMedia({
    peer: new Api.InputPeerSelf(),
    media: new Api.InputMediaUploadedPhoto({ file: uploadedFile }),
  }));
  if (!(uploadedMedia instanceof Api.MessageMediaPhoto) || !uploadedMedia.photo) {
    throw new Error(`Telegram did not return a photo for ${path.basename(filePath)}.`);
  }
  return new Api.InputMediaPhoto({ id: utils.getInputPhoto(uploadedMedia.photo) });
}

async function main() {
  const apiIdText = requiredEnv('TELEGRAM_API_ID');
  const apiHash = requiredEnv('TELEGRAM_API_HASH');
  const apiId = Number(apiIdText);
  if (!Number.isSafeInteger(apiId) || apiId <= 0) throw new Error('TELEGRAM_API_ID must be a positive number.');

  const files = await mediaFiles();
  console.log(`Preview order for @${BOT_USERNAME}:`);
  files.forEach((file, index) => console.log(`  ${index + 1}. ${path.basename(file)}`));
  if (dryRun) {
    console.log('\nValidation passed. No Telegram connection was made.');
    return;
  }

  const terminal = createInterface({ input, output });
  const client = new TelegramClient(new StringSession(await loadSession()), apiId, apiHash, { connectionRetries: 5 });
  try {
    await client.start({
      phoneNumber: () => terminal.question('Telegram phone number (international format): '),
      phoneCode: () => terminal.question('Telegram login code: '),
      password: hint => terminal.question(`Telegram 2FA password${hint ? ` (${hint})` : ''}: `),
      onError: error => {
        console.error(`Telegram login error: ${error.message}`);
        return false;
      },
    });
    await writeFile(SESSION_FILE, client.session.save(), { encoding: 'utf8', mode: 0o600 });
    const bot = await client.getInputEntity(BOT_USERNAME);
    for (const [index, file] of files.entries()) {
      console.log(`Uploading ${index + 1}/${files.length}: ${path.basename(file)}`);
      const media = await uploadPhoto(client, file);
      await client.invoke(new Api.bots.AddPreviewMedia({ bot, langCode: '', media }));
    }
    console.log(`\nUploaded ${files.length} preview image${files.length === 1 ? '' : 's'} to @${BOT_USERNAME}.`);
  } finally {
    terminal.close();
    await client.disconnect();
  }
}

main().catch(error => {
  console.error(`Preview upload failed: ${error.message}`);
  process.exitCode = 1;
});
