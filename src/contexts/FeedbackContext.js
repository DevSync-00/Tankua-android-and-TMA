import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToastCard from '../components/ToastCard';
import ConfirmModal from '../components/ConfirmModal';

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toastStack: {
    paddingTop: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Dispatch Toast Notification
  const showToast = useCallback(({ type = 'info', title, message, duration = 3500 }) => {
    const id = Date.now().toString() + Math.random().toString();
    const newToast = { id, type, title, message };
    setToasts((prev) => [...prev.slice(-2), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  // Dispatch Custom Confirmation Dialog (Replaces native Alert.alert / confirm)
  const confirm = useCallback(
    ({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
      return new Promise((resolve) => {
        setConfirmConfig({
          title,
          message,
          confirmText,
          cancelText,
          variant,
          onConfirm: () => {
            setConfirmConfig(null);
            resolve(true);
          },
          onCancel: () => {
            setConfirmConfig(null);
            resolve(false);
          },
        });
      });
    },
    []
  );

  // Dispatch Custom Single-Action Alert Dialog (Replaces native Alert.alert)
  const alert = useCallback(
    ({ title = 'Alert', message = '', buttonText = 'OK', variant = 'info' }) => {
      return new Promise((resolve) => {
        setConfirmConfig({
          title,
          message,
          confirmText: buttonText,
          cancelText: null, // Hide cancel button
          variant,
          onConfirm: () => {
            setConfirmConfig(null);
            resolve(true);
          },
          onCancel: () => {
            setConfirmConfig(null);
            resolve(true);
          },
        });
      });
    },
    []
  );

  return (
    <FeedbackContext.Provider value={{ showToast, confirm, alert }}>
      {children}

      {/* Global Toast Render Layer */}
      <SafeAreaView style={styles.toastOverlay} pointerEvents="box-none">
        <View style={styles.toastStack} pointerEvents="box-none">
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </View>
      </SafeAreaView>

      {/* Global Confirmation Modal */}
      <ConfirmModal visible={!!confirmConfig} config={confirmConfig} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
