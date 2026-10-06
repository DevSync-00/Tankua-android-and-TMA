package com.tankua.telegramlogin

import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.telegram.login.TelegramLogin

class TelegramLoginModule : Module() {

    companion object {
        private const val PREFS_NAME = "tankua_telegram_login_prefs"
        private const val KEY_PENDING_URI = "pending_callback_uri"
        private const val KEY_SAVED_NONCE = "saved_auth_nonce"

        private var activeModuleInstance: TelegramLoginModule? = null
        private var currentNonce: String? = null

        fun handleCallbackUri(uri: Uri, context: Context? = null) {
            val instance = activeModuleInstance
            if (instance != null) {
                instance.processUriResponse(uri)
            } else if (context != null) {
                // Buffer callback URI in SharedPreferences for cold-start replay
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString(KEY_PENDING_URI, uri.toString()).apply()
            }
        }
    }

    override fun definition() = ModuleDefinition {
        Name("TelegramLoginModule")

        Events("onTelegramLoginResult")

        OnCreate {
            activeModuleInstance = this@TelegramLoginModule
            checkPendingCallback()
        }

        OnStartObserving {
            checkPendingCallback()
        }

        OnDestroy {
            if (activeModuleInstance == this@TelegramLoginModule) {
                activeModuleInstance = null
            }
        }

        Function("init") { clientId: String, redirectUri: String, scopes: List<String> ->
            try {
                TelegramLogin.init(
                    clientId = clientId,
                    redirectUri = redirectUri,
                    scopes = scopes
                )
                true
            } catch (e: Throwable) {
                false
            }
        }

        Function("startLogin") { nonce: String? ->
            currentNonce = nonce
            val activity = appContext.currentActivity
                ?: throw IllegalStateException("Current activity is null")

            try {
                // Persist nonce for cold-start safety
                if (nonce != null) {
                    val prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    prefs.edit().putString(KEY_SAVED_NONCE, nonce).apply()
                }
                TelegramLogin.startLogin(activity)
                true
            } catch (e: Throwable) {
                val errorMsg = e.message ?: "Failed to start Telegram login"
                val isNotInstalled = errorMsg.contains("not installed", ignoreCase = true) ||
                        errorMsg.contains("ActivityNotFoundException", ignoreCase = true)

                sendEvent("onTelegramLoginResult", mapOf(
                    "error" to errorMsg,
                    "errorCode" to if (isNotInstalled) "TELEGRAM_NOT_INSTALLED" else "SDK_START_FAILED",
                    "nonce" to currentNonce
                ))
                false
            }
        }
    }

    private fun checkPendingCallback() {
        val context = appContext.reactContext ?: appContext.currentActivity ?: return
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val pendingUriStr = prefs.getString(KEY_PENDING_URI, null)
        if (!pendingUriStr.isNullOrBlank()) {
            if (currentNonce == null) {
                currentNonce = prefs.getString(KEY_SAVED_NONCE, null)
            }
            prefs.edit().remove(KEY_PENDING_URI).apply()
            try {
                val uri = Uri.parse(pendingUriStr)
                processUriResponse(uri)
            } catch (e: Throwable) {
                // Ignore parse errors on malformed buffered URI
            }
        }
    }

    private fun processUriResponse(uri: Uri) {
        val nonce = currentNonce
        try {
            TelegramLogin.handleLoginResponse(
                uri = uri,
                onSuccess = { loginData ->
                    val idToken = loginData.idToken
                    sendEvent("onTelegramLoginResult", mapOf(
                        "idToken" to idToken,
                        "nonce" to nonce,
                        "error" to null
                    ))
                },
                onError = { error ->
                    val errorString = error.toString()
                    val isNotInstalled = errorString.contains("not installed", ignoreCase = true)
                    sendEvent("onTelegramLoginResult", mapOf(
                        "error" to errorString,
                        "errorCode" to if (isNotInstalled) "TELEGRAM_NOT_INSTALLED" else "LOGIN_FAILED",
                        "nonce" to nonce
                    ))
                }
            )
        } catch (e: Throwable) {
            // Fallback direct URI fragment/query parser if SDK parser throws
            val fragment = uri.fragment ?: ""
            val queryToken = uri.getQueryParameter("id_token")
            val fragmentToken = if (fragment.contains("id_token=")) {
                fragment.split("id_token=").getOrNull(1)?.split("&")?.firstOrNull()
            } else null

            val extractedToken = queryToken ?: fragmentToken

            if (extractedToken != null) {
                sendEvent("onTelegramLoginResult", mapOf(
                    "idToken" to extractedToken,
                    "nonce" to nonce,
                    "error" to null
                ))
            } else {
                sendEvent("onTelegramLoginResult", mapOf(
                    "error" to (e.message ?: "Failed to process Telegram callback URI"),
                    "errorCode" to "PARSING_FAILED",
                    "nonce" to nonce
                ))
            }
        }
    }
}
