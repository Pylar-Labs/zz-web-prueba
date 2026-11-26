// Textos fijos de la interfaz en cada idioma (spec 004). Es el ÚNICO lugar donde vive texto fijo
// de la interfaz: los componentes lo leen de `siteConfig.ui`, no lo escriben.
//
// Los tres idiomas deben tener exactamente las mismas claves y los mismos marcadores ({name},
// {product}); `scripts/site-i18n.test.mjs` lo comprueba. El español es el texto de siempre.
// Nota: este archivo lo importan también scripts de Node (type stripping): solo datos y una función
// sin tipos de compilador, extensiones `.ts` en rutas relativas, sin enums ni alias `@/`.

export const LANGUAGES = ["es", "en", "pt"] as const;
export type Language = (typeof LANGUAGES)[number];

export const UI_TEXT = {
  es: {
    nav: {
      home: "Inicio",
      about: "Nosotros",
      services: "Servicios",
      products: "Productos",
      testimonials: "Testimonios",
      contact: "Contacto",
    },
    aria: { openMenu: "Abrir menú", whatsapp: "Contactar por WhatsApp" },
    footer: { rights: "Todos los derechos reservados." },
    form: {
      title: "Envianos un mensaje",
      name: "Nombre",
      email: "Email",
      subject: "Asunto",
      message: "Mensaje",
      namePlaceholder: "Tu nombre",
      emailPlaceholder: "tu@email.com",
      subjectPlaceholder: "¿En qué podemos ayudarte?",
      messagePlaceholder: "Contanos tu consulta...",
      submit: "Enviar por WhatsApp",
    },
    info: { title: "Información de contacto", phone: "Teléfono", email: "Email", address: "Ubicación" },
    whatsapp: { title: "Escribinos por WhatsApp", subtitle: "Respondemos rápido" },
    catalog: { cta: "Consultar por WhatsApp" },
    message: {
      general: "Hola {name}, quiero hacer una consulta",
      product: "Hola, me interesa el producto: {product}",
    },
    htmlLang: "es",
  },
  en: {
    nav: {
      home: "Home",
      about: "About us",
      services: "Services",
      products: "Products",
      testimonials: "Testimonials",
      contact: "Contact",
    },
    aria: { openMenu: "Open menu", whatsapp: "Contact us on WhatsApp" },
    footer: { rights: "All rights reserved." },
    form: {
      title: "Send us a message",
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      namePlaceholder: "Your name",
      emailPlaceholder: "you@email.com",
      subjectPlaceholder: "How can we help you?",
      messagePlaceholder: "Tell us about your inquiry...",
      submit: "Send via WhatsApp",
    },
    info: { title: "Contact information", phone: "Phone", email: "Email", address: "Location" },
    whatsapp: { title: "Message us on WhatsApp", subtitle: "We reply quickly" },
    catalog: { cta: "Ask on WhatsApp" },
    message: {
      general: "Hello {name}, I would like to ask a question",
      product: "Hello, I am interested in the product: {product}",
    },
    htmlLang: "en",
  },
  pt: {
    nav: {
      home: "Início",
      about: "Sobre nós",
      services: "Serviços",
      products: "Produtos",
      testimonials: "Depoimentos",
      contact: "Contato",
    },
    aria: { openMenu: "Abrir menu", whatsapp: "Fale conosco pelo WhatsApp" },
    footer: { rights: "Todos os direitos reservados." },
    form: {
      title: "Envie uma mensagem",
      name: "Nome",
      email: "E-mail",
      subject: "Assunto",
      message: "Mensagem",
      namePlaceholder: "Seu nome",
      emailPlaceholder: "voce@email.com",
      subjectPlaceholder: "Como podemos ajudar?",
      messagePlaceholder: "Conte-nos sobre sua dúvida...",
      submit: "Enviar pelo WhatsApp",
    },
    info: { title: "Informações de contato", phone: "Telefone", email: "E-mail", address: "Localização" },
    whatsapp: { title: "Escreva para nós no WhatsApp", subtitle: "Respondemos rapidamente" },
    catalog: { cta: "Consultar pelo WhatsApp" },
    message: {
      general: "Olá {name}, gostaria de fazer uma consulta",
      product: "Olá, tenho interesse no produto: {product}",
    },
    htmlLang: "pt-BR",
  },
};

// Rellena los marcadores {name}, {product}… de un mensaje. Un marcador sin valor queda como está.
// Usa una función de reemplazo para que `$&` y similares del valor no se interpreten.
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}
