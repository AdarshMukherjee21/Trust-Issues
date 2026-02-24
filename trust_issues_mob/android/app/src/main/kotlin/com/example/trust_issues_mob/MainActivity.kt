package com.example.trust_issues_mob

import android.app.role.RoleManager
import android.os.Build
import android.os.Bundle
import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "sms_role_channel"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            CHANNEL
        ).setMethodCallHandler { call, result ->

            if (call.method == "requestSmsRole") {
                requestSmsRole()
                result.success(null)
            } else {
                result.notImplemented()
            }
        }
    }

    private fun requestSmsRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(RoleManager::class.java)

            if (roleManager.isRoleAvailable(RoleManager.ROLE_SMS)) {
                if (!roleManager.isRoleHeld(RoleManager.ROLE_SMS)) {
                    val intent =
                        roleManager.createRequestRoleIntent(RoleManager.ROLE_SMS)
                    startActivity(intent)
                }
            }
        }
    }
}