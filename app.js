/*
    *  ----------------------------------  *
    *  -----  /app.js  --  /app.js  -----  *
    *  ----------------------------------  *
*/


import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';


/*
    * ----------------------------------------------------------
    * -----  Servidor Express para chatbots usando OpenAI  -----
    * ----------------------------------------------------------
    * - Sirve frontend estático.
    * - Expone endpoint POST /api/chatbot.
    * - Interactúa con un modelo de OpenAI para generar respuestas.
    * --------------------------------------------------------------
*/


/*
    *  -----------------------------  *
    *  -----  Configuraciones  -----  *
    *  -----------------------------  *  
*/


/**  -----  Configuracion de variables de entorno con dotenv  ----- */
dotenv.config();

/** -----  `Ruta absoluta del archivo actual`  ----- */
const currentFilePath = fileURLToPath(import.meta.url);

/** -----  `Ruta absoluta del directorio actual`  ----- */
const currentDirPath = path.dirname(currentFilePath);

/** -----  `Ruta absoluta del frontend estatico`  ----- */
const publicDirPath = path.join(currentDirPath, 'public');

/**   -----  `Inicializacion de la aplicacion Express`  ----- */
const app = express();

/**  -----  `Puerto del servidor`  ----- */
const PORT = process.env.PORT || 3000;

/** @type {string} -----  `Ruta base del proyecto`  ----- */
const base = '/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai';


/*
    *  --------------------  *
    *  -----  OpenAI  -----  *
    *  --------------------  *  
*/

/** -----  `Inicialización del cliente de OpenAI`  ----- */
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/** -----  `ID del Assistant en OpenAI Platform`  ----- */
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || 'asst_TFIoJkpE19uwqR3kwel1UJp8';



/*
    *  -------------------------  *
    *  -----  Middlewares  -----  *
    *  -------------------------  *
*/


//*  -----  Servir archivos estaticos desde la carpeta 'public'  -----
app.use(express.static(publicDirPath));
app.use(base, express.static(publicDirPath));

//*  -----  Middleware para parsear JSON -----
app.use(express.json());

//*  -----  Middleware para parsear datos URL-encoded -----
app.use(express.urlencoded({ extended: true }));

//*  -----  Redirigir la raiz del host hacia la ruta base del proyecto  -----
app.get('/', (_req, res) => {
    res.redirect(base);
});



/*
    *  ----------------------------------  *
    *  -----  Funciones de negocio  -----  *
    *  ----------------------------------  *
*/



/**  
 * -----------------------------
 * -----  `userThreads`  -----
 * -----------------------------
 * -----  `Almacena el id del thread de cada usuario para mantener el contexto de la conversación`  ----- 
 * @type {Record<string, string>} 
 */

let userThreads = {};



/**
 * ------------------------------------------
 * -----  `getMessageFromRequest(req)`  -----
 * ------------------------------------------
 * - `Obtiene y normaliza el mensaje del usuario`
 * @param {express.Request} req - La solicitud HTTP de Express que contiene el mensaje del usuario en el cuerpo
 * @returns {ChatbotRequestBody} - El mensaje del usuario normalizado
 */

const getMessageFromRequest = (req) => {

    /** @type {ChatbotRequestBody} - `Cuerpo de la solicitud del chatbot` */
    const body = req.body;


    //  -----  Retorna el mensaje del usuario normalizado o una cadena vacía si no es válido  -----
    //return body?.message?.trim() || '';

    /** @type {ChatbotRequestBody} */
    const message = {
        message: body?.message?.trim() || '',
        userId: body?.userId
    }

    return message;

}



/**
 * ---------------------------------------------
 * -----  `validateMessage(message, res)`  -----
 * ---------------------------------------------
 * - `Valida el mensaje del usuario y responde 400 si no es válido`
 * @param {string} message - El mensaje del usuario a validar
 * @param {express.Response} res - La respuesta HTTP de Express para enviar errores si el mensaje no es válido
 * @returns {boolean} - `true` si el mensaje es válido, `false` en caso contrario
 */

const validateMessage = (message, res) => {

    //  -----  Validacion basica del mensaje del usuario (no vacio)  -----
    if (message)
        return true;

    //  -----  Responde con error 400 si el mensaje no es valido  -----
    res.status(400).json({
        error: 'Has mandado un mensaje vacio. La pregunta del usuario es requerida!!'
    });

    //  -----  Retorna false para indicar que el mensaje no es valido  -----
    return false;

}



/**
 * -------------------------------------------------------------------
 * -----  `generateChatbotReply(userMessage, previousThreadId)`  -----
 * -------------------------------------------------------------------
 * @async
 * - `Genera una respuesta usando Assistants API (threads + runs)`
 * -  Mantiene el contexto reutilizando el thread por usuario.
 * @param {string} userMessage - El mensaje del usuario
 * @param {string} [previousThreadId] - ID del thread anterior para mantener el contexto (opcional)
 * @returns {Promise<{ reply: string, threadId: string }>} - La respuesta generada y el thread usado
 * @throws {Error} - Si ocurre un error durante la generación de la respuesta
 */

const generateChatbotReply = async (userMessage, previousThreadId) => {

    if (!ASSISTANT_ID)
        throw new Error('Falta OPENAI_ASSISTANT_ID para ejecutar el assistant.');


    /** -----  `Reutiliza thread existente o crea uno nuevo`  ----- */
    const threadId = previousThreadId || (await openai.beta.threads.create()).id;

    //  -----  Muestra el thread ID usado para esta conversación  -----
    console.log(`Thread ID usado para esta conversación => ${threadId}`);


    /** -----  `Agrega el mensaje del usuario al thread`  ----- */
    await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage
    });

    /** -----  `Ejecuta el assistant y espera estado terminal`  ----- */
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: ASSISTANT_ID,
    });

    //  -----  Verifica que el run finalizó correctamente  -----
    if (run.status !== 'completed')
        throw new Error(`Run finalizó con estado no exitoso: ${run.status}`);

    //  -----  Muestra el estado final del run  -----
    console.log('status => ', run.status);


    /** -----  `Lee el último mensaje del assistant`  ----- */
    const messages = await openai.beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: 10
    });

    console.log('Mensajes del thread => ', messages);


    /** -----  `Encuentra el último mensaje del assistant`  ----- */
    const assistantMessage = messages.data.find((message) => message.role === 'assistant');

    /** -----  `Extrae el contenido de texto del último mensaje del assistant`  ----- */
    const reply = assistantMessage?.content
        ?.filter((contentBlock) => contentBlock.type === 'text')
        ?.map((contentBlock) => contentBlock.text.value)
        ?.join('\n')
        ?.trim() || 'No pude generar una respuesta ahora mismo.';

    //  -----  Muestra la respuesta generada por el assistant  -----
    console.log('Respuesta del assistant => ', reply);

    return {
        reply,
        threadId
    };

}



/**
 * ----------------------------------------------
 * -----  `handleChatbotError(error, res)`  -----
 * ----------------------------------------------
 * - `Maneja errores de API del endpoint`
 * @param {unknown} error - Error ocurrido durante la generación de la respuesta del chatbot
 * @param {express.Response} res - La respuesta HTTP de Express
 */

const handleChatbotError = (error, res) => {

    console.error('Error al generar respuesta del chatbot:', error);

    //  -----  Responde con error 500 si ocurre un error durante la generación de la respuesta del chatbot  -----
    return res.status(500).json({
        error: 'Error al generar respuesta del chatbot.'
    });

}



/*  
    *  -----------------------------------------  *
    *  -----  Endpoint POST /api/chatbot  -----  *
    *  -----------------------------------------  *
*/


/**
 * ----------------------------------------------  
 * -----  `handleChatbotRequest(req, res)`  -----  
 * ----------------------------------------------  
 * - `Maneja la solicitud del chatbot: valida, genera respuesta y maneja errores`
 * @async
 * @param {express.Request} req - La solicitud HTTP de Express
 * @param {express.Response} res - La respuesta HTTP de Express
 * @returns {Promise<void>} - No retorna valor; solo envía la respuesta HTTP
 */

const handleChatbotRequest = async (req, res) => {


    /** -----`datos del request` */
    const { message, userId } = getMessageFromRequest(req);


    //  -----  Validacion del mensaje del usuario  -----
    if (!validateMessage(message, res))
        return;


    //  -----  Generacion de la respuesta del chatbot y manejo de errores  -----
    try {

        /**  -----  `id del thread anterior del usuario (si existe)`  ----- */
        const previousThreadId = userThreads[userId];

        /**  -----  `Generamos la respuesta del chatbot`  ----- */
        const { reply, threadId } = await generateChatbotReply(message, previousThreadId);


        //  -----  Guardamos el thread para mantener contexto por usuario  -----
        userThreads[userId] = threadId;


        //  -----  Responde con la respuesta generada por el chatbot  -----
        res.json({
            success: true,
            message: reply
        });

    }

    //  -----  Manejo de errores durante la generación de la respuesta del chatbot  -----
    catch (error) {

        handleChatbotError(error, res);
    }

}



//*  -----  Endpoint POST /api/chatbot que maneja la solicitud del chatbot usando la funcion handleChatbotRequest  -----
app.post('/api/chatbot', handleChatbotRequest);
app.post(`${base}/api/chatbot`, handleChatbotRequest);

console.log('Historial de threads de los usuarios => ', userThreads);


/*
    *  ---------------------------------------------------------------  *
    *  -----  Inicia el servidor HTTP en el puerto especificado  -----  * 
    *  -----  y muestra un mensaje en consola                    -----  *
    *  ---------------------------------------------------------------  *
*/

app.listen(PORT, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${PORT}${base} ✅`);
});
