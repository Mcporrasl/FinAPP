import { useEffect, useCallback } from 'react';

export function usePushNotifications() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window) || !window.Notification) {
      console.log('Este navegador no soporta notificaciones de escritorio / móviles');
      return false;
    }

    if (window.Notification.permission === 'granted') {
      return true;
    }

    if (window.Notification.permission !== 'denied') {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || !window.Notification) return;

    if (window.Notification.permission === 'granted') {
      try {
        new window.Notification(title, options);
      } catch (e) {
        console.warn('Notification execution failed:', e);
      }
    }
  }, []);

  // Recordatorio diario
  useEffect(() => {
    const checkReminder = () => {
      if (!('Notification' in window) || !window.Notification) return;
      if (window.Notification.permission !== 'granted') return;

      const lastReminderStr = localStorage.getItem('last_expense_reminder');
      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      if (!lastReminderStr || (now - parseInt(lastReminderStr, 10)) > TWENTY_FOUR_HOURS) {
        sendNotification('¡Hora de registrar tus gastos!', {
          body: 'Unos minutos al día mantienen tus finanzas en orden. ¿Ya registraste tus gastos de hoy?',
          icon: '/favicon.ico'
        });
        localStorage.setItem('last_expense_reminder', now.toString());
      }
    };

    // Revisar al iniciar
    checkReminder();

    // Configurar un intervalo para revisar periódicamente si la pestaña se queda abierta
    const interval = setInterval(checkReminder, 60 * 60 * 1000); // Revisar cada hora
    return () => clearInterval(interval);
  }, [sendNotification]);

  return { requestPermission, sendNotification };
}
