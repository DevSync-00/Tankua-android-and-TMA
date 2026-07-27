import worker from '../../../server/worker-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handle(request) {
  return worker.fetch(request, process.env);
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as OPTIONS,
  handle as HEAD,
};
