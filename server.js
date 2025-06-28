const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Variables de entorno (compatible con Render.com)
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || process.env.EXPO_PUBLIC_WEBHOOK_VERIFY_TOKEN || 'mi_token_verificacion_webhook';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || process.env.EXPO_PUBLIC_WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.EXPO_PUBLIC_WHATSAPP_PHONE_ID;
const PORT = process.env.PORT || 3000;

console.log('🔧 Configuración del servidor webhook:');
console.log('📝 Verify Token:', VERIFY_TOKEN ? '✅ Configurado' : '❌ Faltante');
console.log('🔑 WhatsApp Token:', WHATSAPP_TOKEN ? '✅ Configurado' : '❌ Faltante');
console.log('📱 Phone ID:', WHATSAPP_PHONE_ID ? '✅ Configurado' : '❌ Faltante');
console.log('🌐 Puerto:', PORT);

// Endpoint de salud
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: '🤖 Servidor webhook de WhatsApp funcionando',
    timestamp: new Date().toISOString(),
    config: {
      verifyToken: !!VERIFY_TOKEN,
      whatsappToken: !!WHATSAPP_TOKEN,
      phoneId: !!WHATSAPP_PHONE_ID,
      port: PORT
    },
    endpoints: {
      health: 'GET /',
      webhook: 'GET,POST /webhook',
      test: 'POST /test-webhook'
    }
  });
});

// Verificación del webhook (GET) - Para Meta for Developers
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Verificación de webhook recibida:');
  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Challenge:', challenge);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Error en verificación de webhook');
    console.log('Token esperado:', VERIFY_TOKEN);
    console.log('Token recibido:', token);
    res.sendStatus(403);
  }
});

// Recibir mensajes de WhatsApp (POST)
app.post('/webhook', async (req, res) => {
  const body = req.body;
  
  console.log('📨 Webhook POST recibido:', JSON.stringify(body, null, 2));

  try {
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const messages = change.value?.messages;
            const contacts = change.value?.contacts;
            
            messages?.forEach(async message => {
              const from = message.from;
              const messageBody = message.text?.body;
              const messageId = message.id;
              const timestamp = message.timestamp;
              
              // Obtener nombre del contacto si está disponible
              const contact = contacts?.find(c => c.wa_id === from);
              const contactName = contact?.profile?.name || 'Usuario';
              
              console.log(`📱 Mensaje recibido:`);
              console.log(`   👤 De: ${contactName} (${from})`);
              console.log(`   📝 Mensaje: "${messageBody}"`);
              console.log(`   🆔 ID: ${messageId}`);
              console.log(`   ⏰ Timestamp: ${timestamp}`);
              
              // Procesar mensaje y enviar respuesta automática
              await processAndRespond(from, messageBody, messageId);
            });
          }
        });
      });
      
      res.status(200).send('OK');
    } else {
      console.log('❌ Objeto no reconocido:', body.object);
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('💥 Error procesando webhook:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Función para procesar mensaje y responder automáticamente
async function processAndRespond(fromPhone, messageBody, messageId) {
  try {
    console.log('🤖 Procesando mensaje para respuesta automática...');
    
    // Simular el objeto de mensaje que espera nuestro servicio
    const message = {
      from: fromPhone,
      body: messageBody,
      timestamp: new Date().toISOString(),
      messageId: messageId
    };
    
    // Generar respuesta usando nuestro sistema existente
    const response = generateAutoResponse(message);
    
    if (response) {
      console.log(`🎯 Respuesta generada: "${response}"`);
      
      // Enviar respuesta automática
      const result = await sendWhatsAppMessage(fromPhone, response);
      
      if (result.success) {
        console.log('✅ Respuesta automática enviada exitosamente');
        console.log('📨 Message ID:', result.messageId);
      } else {
        console.error('❌ Error enviando respuesta automática:', result.error);
      }
    } else {
      console.log('🔇 No se generó respuesta automática para este mensaje');
    }
  } catch (error) {
    console.error('💥 Error en processAndRespond:', error);
  }
}

// Función para generar respuesta automática (usando nuestra lógica existente)
function generateAutoResponse(message) {
  console.log('🧠 Generando respuesta automática...');
  
  const messageBody = message.body.toLowerCase().trim();
  
  // Sistema de respuestas automáticas
  const autoResponses = [
    {
      trigger: 'hola',
      response: '¡Hola! 👋 Gracias por contactarnos. ¿En qué podemos ayudarte?',
      enabled: true
    },
    {
      trigger: 'cita',
      response: '📅 Para agendar una cita, puedes llamarnos al (57) 300 123 4567 o escribenos tu disponibilidad.',
      enabled: true
    },
    {
      trigger: 'horarios',
      response: '🕐 Nuestros horarios de atención son:\nLunes a Viernes: 8:00 AM - 6:00 PM\nSábados: 9:00 AM - 2:00 PM',
      enabled: true
    },
    {
      trigger: 'ayuda',
      response: '🆘 Estamos aquí para ayudarte. Puedes preguntarnos sobre:\n• Citas\n• Horarios\n• Servicios\n• Información general',
      enabled: true
    }
  ];
  
  // Buscar trigger que coincida
  for (const autoResponse of autoResponses) {
    if (autoResponse.enabled && messageBody.includes(autoResponse.trigger.toLowerCase())) {
      console.log('✅ Trigger encontrado:', autoResponse.trigger);
      return autoResponse.response;
    }
  }
  
  // Respuesta por defecto
  console.log('🔄 Usando respuesta por defecto');
  return '🤖 Gracias por tu mensaje. En breve alguien de nuestro equipo te contactará.\n\nPuedes escribir "ayuda" para ver las opciones disponibles.';
}

// Función para enviar mensaje de WhatsApp
async function sendWhatsAppMessage(to, message) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error('❌ Faltan credenciales de WhatsApp');
    return { success: false, error: 'Credenciales de WhatsApp no configuradas' };
  }
  
  try {
    const cleanPhone = to.replace(/[^\d]/g, '');
    
    console.log('📡 Enviando mensaje de WhatsApp...');
    console.log('📞 Destino:', cleanPhone);
    console.log('📝 Mensaje:', message.substring(0, 100) + '...');
    
    const response = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message
        }
      })
    });
    
    const data = await response.json();
    
    console.log('📥 Respuesta de WhatsApp API:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      return { 
        success: true, 
        messageId: data.messages?.[0]?.id,
        whatsappId: data.messages?.[0]?.wa_id
      };
    } else {
      return { 
        success: false, 
        error: data.error?.message || 'Error de la API de WhatsApp',
        code: data.error?.code
      };
    }
  } catch (error) {
    console.error('💥 Error enviando mensaje:', error);
    return { 
      success: false, 
      error: 'Error de conexión: ' + error.message 
    };
  }
}

// Endpoint para probar el webhook manualmente
app.post('/test-webhook', async (req, res) => {
  const { from, message } = req.body;
  
  console.log('🧪 Prueba manual de webhook...');
  console.log('From:', from);
  console.log('Message:', message);
  
  if (!from || !message) {
    return res.status(400).json({ 
      error: 'Faltan parámetros: from y message son requeridos' 
    });
  }
  
  try {
    await processAndRespond(from, message, 'test_' + Date.now());
    res.json({ success: true, message: 'Webhook procesado correctamente' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error procesando webhook: ' + error.message 
    });
  }
});

// Endpoint adicional para verificar salud del sistema
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Manejo de errores
app.use((error, req, res, next) => {
  console.error('💥 Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: error.message 
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    available: [
      'GET /',
      'GET /webhook',
      'POST /webhook',
      'POST /test-webhook',
      'GET /health'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Servidor webhook iniciado exitosamente');
  console.log(`📡 URL local: http://localhost:${PORT}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test-webhook`);
  console.log(`❤️ Health endpoint: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📋 Para configurar en Meta for Developers:');
  console.log('1. Usa la URL de Render.com cuando despliegues');
  console.log('2. Configura la URL del webhook en Meta');
  console.log('3. Usa el verify token configurado');
  console.log('');
  console.log('🔧 Variables de entorno necesarias:');
  console.log('- WEBHOOK_VERIFY_TOKEN (o EXPO_PUBLIC_WEBHOOK_VERIFY_TOKEN)');
  console.log('- WHATSAPP_TOKEN (o EXPO_PUBLIC_WHATSAPP_TOKEN)');
  console.log('- WHATSAPP_PHONE_ID (o EXPO_PUBLIC_WHATSAPP_PHONE_ID)');
});

module.exports = app;
