# WhatsApp Chatbot Webhook Server

Servidor webhook para chatbot de WhatsApp Business Cloud API con respuestas automáticas.

## Deploy en Render.com

### Variables de entorno requeridas:
- `WEBHOOK_VERIFY_TOKEN`: Token para verificación del webhook
- `WHATSAPP_TOKEN`: Token de acceso de la API de WhatsApp Business
- `WHATSAPP_PHONE_ID`: ID del número de teléfono de WhatsApp Business

### Endpoints:
- `GET /`: Estado del servidor
- `GET /webhook`: Verificación del webhook (Meta)
- `POST /webhook`: Recepción de mensajes
- `POST /test-webhook`: Pruebas de webhook

### Configuración en Meta for Developers:
1. URL del webhook: `https://tu-app.onrender.com/webhook`
2. Token de verificación: El valor de `WEBHOOK_VERIFY_TOKEN`
3. Suscribirse a: messages, message_status

## Desarrollo local:
```bash
npm install
npm run dev
```

## Producción:
```bash
npm start
```
