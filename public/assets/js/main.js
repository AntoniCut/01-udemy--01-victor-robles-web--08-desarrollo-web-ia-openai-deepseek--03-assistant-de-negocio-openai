/*
    *  -----------------------------------------------------  *
    *  -----  /main.js  --  /public/assets/js/main.js  -----  *
    *  -----------------------------------------------------  *
*/


(() => {


    /** @type {string} -----  `Ruta base del proyecto`  ----- */
    const base = '/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/03-assistant-de-negocio-openai';


    //  -----  Referencias al DOM  -----

    /** @type {HTMLButtonElement | null} - `botón de envio` */
    const $sendButton = document.querySelector('#sendButton');

    /** @type {HTMLDivElement | null} - `contenedor de mensajes del chat` */
    const $chatMessages = document.querySelector('.chat__messages');

    /** @type {HTMLInputElement | null} - `input de texto` */
    const $inputText = document.querySelector('#inputText');


    //  -----  Variables para manejar la conversación  -----

    /** @type {number} - `Identificador del usuario para esta sesión` */
    const userId = Date.now() + Math.floor(777 + Math.random() * 7000); // Usar timestamp como ID de usuario único para esta sesión



    /**
     * ----------------------------
     * -----  `scrollChat()`  -----
     * ----------------------------
     * - Desplaza el contenedor de mensajes del chat hacia abajo para mostrar el nuevo mensaje.
     */

    const scrollChat = () => {

        //  -----  Desplazar el contenedor de mensajes del chat  -----
        //  -----  hacia abajopara mostrar el nuevo mensaje      -----
        if ($chatMessages)
            $chatMessages.scrollTop = $chatMessages.scrollHeight;

    };



    /**
     * ------------------------------------
     * -----  `appendUserMessage()`  -----
     * ------------------------------------
     * - Crea y agrega el mensaje del usuario al contenedor del chat.
     * @param {string} text - `texto ingresado por el usuario`
     */

    const appendUserMessage = (text) => {

        /** @type {HTMLDivElement} - `crear mensaje de usuario` */
        const $userMessage = document.createElement('div');

        //  -----  Agregar clases CSS para el mensaje de usuario  -----
        $userMessage.classList.add('chat__message', 'chat__message--user');

        //  -----  Establecer el contenido del mensaje de usuario  -----
        $userMessage.textContent = `Tú: ${text}`;

        //  -----  Agregar el mensaje de usuario al contenedor de mensajes del chat  -----
        $chatMessages?.appendChild($userMessage);

        //  -----  Desplazar el contenedor de mensajes del chat  -----
        //  -----  hacia abajopara mostrar el nuevo mensaje      -----
        scrollChat();

    };



    /**
     * -------------------------------------
     * -----  `generateUserMessage()`  -----
     * -------------------------------------
     * - Valida el texto ingresado y construye el cuerpo de la solicitud para el chatbot.
     * @returns {ChatbotRequestBody | undefined} - Una solicitud válida o `undefined` si no hay texto.
     */

    const generateUserMessage = () => {

        /**  -----  `texto ingresado en el input` -----  */
        const text = $inputText?.value.trim();

        //  -----  Validar texto ingresado  -----
        if (!text) {
            alert('Por favor, ingresa un mensaje para enviar.');
            return;
        }

        //  -----  Agregar el mensaje de usuario al contenedor de mensajes del chat  -----
        appendUserMessage(text);

        /** @type {ChatbotRequestBody} */
        const userMessage = {
            message: text,
            userId
        };

        return userMessage;

    };



    /**
     * --------------------------------------
     * -----  `fetchChatbotMessage()`  -----
     * --------------------------------------
     * @async
     * Envía un mensaje al servidor y devuelve solo el texto de respuesta del chatbot.
     * @param {string} message - `mensaje del usuario`
     * @returns {Promise<string>} - Mensaje del chatbot.
     * @throws {Error} - Error si la API falla o no devuelve contenido válido.
     */

    const fetchChatbotMessage = async (message) => {

        //  -----  Enviar el mensaje al servidor para su procesamiento  -----

        /**  -----  `Petición asincrona a la API del chatbot` -----  */
        const response = await fetch(`${base}/api/chatbot`, {

            //  -----  Método POST para enviar el mensaje del usuario  -----
            method: 'POST',

            //  -----  Encabezados para indicar que el cuerpo de la solicitud es JSON  -----
            headers: {
                'Content-Type': 'application/json'
            },

            //  -----  Cuerpo de la solicitud con el mensaje del usuario  -----
            body: JSON.stringify({
                message,
                userId
            })

        });


        /**  -----  Òbtener datos de la respuesta del chatbot  ----- */
        /** @type {ChatbotResponse} */
        const data = await response.json();

        console.log('Respuesta del chatbot :', data);

        //  -----  Validar respuesta del chatbot  -----
        if (!response.ok)
            throw new Error(data?.error || 'Ocurrió un error al obtener la respuesta del chatbot.');

        //  -----  Validar que la respuesta del chatbot contenga un mensaje válido  -----
        if (!data.message)
            throw new Error('La API no devolvió un mensaje válido del chatbot.');

        return data.message;

    };



    /**
     * -----------------------------------
     * -----  `appendBotMessage()`  ------
     * -----------------------------------
     * - Crea y agrega el mensaje de la IA al contenedor del chat.
     * - Si se indica `isTyping`, marca el mensaje como "Escribiendo..." con su clase específica.
     * - Devuelve la referencia al elemento creado para poder actualizarlo después (p. ej. reemplazar "Escribiendo..." por la respuesta final).
     * @param {string} message - `respuesta textual del chatbot`
     * @param {boolean} [isTyping=false] - `true` para aplicar el estilo del estado "Escribiendo..."`
     * @returns {HTMLDivElement | undefined} - `elemento del mensaje del bot añadido al chat`
     */

    const appendBotMessage = (message, isTyping = false) => {

        /** @type {HTMLDivElement} - `crear mensaje de la IA` */
        const $botMessage = document.createElement('div');

        //  -----  Agregar clases CSS para el mensaje del chatbot  -----
        $botMessage.classList.add('chat__message', 'chat__message--bot');

        //  -----  Si es el estado "Escribiendo...", añadimos su clase específica  -----
        if (isTyping)
            $botMessage.classList.add('chat__message--typing');

        //  -----  Establecer el contenido del mensaje del chatbot  -----
        $botMessage.textContent = `Carmen: ${message}`;

        //  -----  Agregar el mensaje del chatbot al contenedor de mensajes del chat  -----
        $chatMessages?.appendChild($botMessage);


        //  -----  Desplazar el contenedor de mensajes del chat  -----
        //  -----  hacia abajopara mostrar el nuevo mensaje      -----
        scrollChat();

        return $botMessage;

    };



    /**
     * -----------------------------
     * -----  `sendMessage()`  -----
     * -----------------------------
     * @async
     * Envía un mensaje al servidor y maneja la respuesta del chatbot.
     * @returns {Promise<void>} - Una promesa que se resuelve cuando el mensaje ha sido enviado y la respuesta del chatbot ha sido manejada.
     */

    const sendMessage = async () => {


        /** @type {ChatbotRequestBody | undefined} - `mensaje del usuario validado` */
        const userMessage = generateUserMessage();

        //  -----  Validar texto ingresado  -----
        if (!userMessage)
            return;

        //  -----  Enviar el mensaje al servidor y manejar la respuesta del chatbot  -----
        try {

            /** @type {HTMLDivElement | undefined} - `elemento temporal con el texto "Escribiendo..." que se reemplazará al recibir la respuesta` */
            const $typingMessage = appendBotMessage('Escribiendo.', true);

            /** @type {number} - `contador de puntos para la animación de "Escribiendo..."` */
            let dots = 1;

            /** @type {ReturnType<typeof setInterval> | undefined} - `intervalo que actualiza los puntos del mensaje "Escribiendo..."` */
            const typingInterval = setInterval(() => {

                //  -----  Ciclar entre 1, 2 y 3 puntos  -----
                dots = (dots % 3) + 1;

                //  -----  Actualizar el texto del mensaje "Escribiendo..." con los puntos correspondientes  -----
                if ($typingMessage)
                    $typingMessage.textContent = `Carmen: Escribiendo${'.'.repeat(dots)}`;

            }, 500);


            //  -----  Validar que la respuesta del chatbot contenga un mensaje válido  -----
            const botMessage = await fetchChatbotMessage(userMessage.message);


            //  -----  Detenemos la animación de "Escribiendo..."  -----
            clearInterval(typingInterval);


            //  -----  Reemplazamos el contenido del mensaje "Escribiendo..." por la respuesta real del bot  -----
            //  -----  y quitamos la clase de "Escribiendo..."                       -----
            if ($typingMessage) {

                $typingMessage.textContent = `Carmen: ${botMessage}`;
                $typingMessage.classList.remove('chat__message--typing');

            } else
                appendBotMessage(botMessage);


            //  -----  Desplazar el contenedor de mensajes del chat hacia abajo para mostrar la nueva respuesta  -----
            scrollChat();

        }

        
        //  -----  Manejar errores en el envío  -----
        catch (error) {
            console.error('Error al enviar: ', error);
            alert('Ocurrió un error al enviar. Por favor, intenta nuevamente.');
        }


        //  -----  vaciar el input  -----
        if ($inputText)
            $inputText.value = '';

    }



    //  -----  Evento de click en el botón de envío  -----
    $sendButton?.addEventListener('click', sendMessage);


    //  -----  Agregar evento keydown al input de texto para detectar Enter  -----
    $inputText?.addEventListener('keydown', (event) => {

        if (event.key === 'Enter') {

            event.preventDefault();

            //  -----  Enviar el mensaje al presionar Enter  -----
            sendMessage();
        }

    });



})();
