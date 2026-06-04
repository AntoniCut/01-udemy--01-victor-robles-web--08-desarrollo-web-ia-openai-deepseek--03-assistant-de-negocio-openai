/*
    --------------------------------------------------
    -----  /global.d.ts  --  /types/global.d.ts  -----
    --------------------------------------------------
*/


/// <reference lib="dom" />
/// <reference lib="es2022" />


/**
 * ----------------------------------------------------------------
 * -----  Tipos DOM extendidos para compatibilidad            -----
 * -----  (por si tu versión de lib.dom.d.ts no los incluye)  -----
 * ----------------------------------------------------------------
 */

interface HTMLHeaderElement extends HTMLElement { }
interface HTMLFooterElement extends HTMLElement { }
interface HTMLMainElement extends HTMLElement { }
interface HTMLNavElement extends HTMLElement { }
interface HTMLSectionElement extends HTMLElement { }
interface HTMLArticleElement extends HTMLElement { }
interface HTMLAsideElement extends HTMLElement { }
interface HTMLFigureElement extends HTMLElement { }
interface HTMLFigcaptionElement extends HTMLElement { }


/**
 * -----------------------------------------------
 * -----  Tipos globales para la aplicación  -----
 * -----------------------------------------------
 */

declare global {
    

    /**  -----  `Cuerpo de la solicitud para el chatbot`  ----- */
    type ChatbotRequestBody = {
        
        /** -----  Mensaje del usuario para el chatbot  ----- */
        message: string;

        /** -----  Identificador del usuario que envía el mensaje  ----- */
        userId: number;
    }


    /**  -----  `Respuesta del chatbot`  ----- */
    type ChatbotResponse = {

        /** -----  Respuesta textual del chatbot  ----- */
        message?: string

        /** -----  Mensaje de error devuelto por la API  ----- */
        error?: string
    }
}


export { }
