package com.tankua.telegramlogin

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class TelegramLoginCallbackActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleDeepLinkIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        handleDeepLinkIntent(intent)
    }

    private fun handleDeepLinkIntent(intent: Intent?) {
        val uri: Uri? = intent?.data
        if (uri != null) {
            TelegramLoginModule.handleCallbackUri(uri)
        }
        finish()
    }
}
