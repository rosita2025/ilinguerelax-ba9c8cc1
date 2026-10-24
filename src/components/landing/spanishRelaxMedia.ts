/**
 * Medios de la landing de Spanish Relax (digital, inglés): punteros a la CDN de la tienda
 * (no se empaquetan en el sitio para no pesar). Son las vistas previas reales del PDF.
 */
const CDN = "https://cdn.shopify.com/s/files/1/0676/0162/9392/files";

export const RELAX_PREVIEWS = [
  { title: "Weekly Spanish study planner", image: `${CDN}/VISTA_1-_Planificador_semanal_de_estudio_de_espanol.png?v=1792803696` },
  { title: "Bilingual index of topics and chapters", image: `${CDN}/VISTA_2-_Indice_bilingue_de_temas_y_capitulos.png?v=1792803700` },
  { title: "Household vocabulary table", image: `${CDN}/VISTA_3-_Tabla_de_vocabulario_del_hogar_en_espanol.png?v=1792803703` },
];

export const RELAX_BONUS_PLANNER = {
  title: "Daily Study Planner",
  image: `${CDN}/BONO_1-_Planificador_de_estudio__casa_y_gramatica_espanola.png?v=1792803972`,
};

export const RELAX_BONUS_EXAM = {
  title: "Complete Spanish Language Exam",
  image: `${CDN}/BONO_2-_Examen_de_vocabulario_espanol__hogar_y_objetos.png?v=1792803973`,
};

export const RELAX_VIDEOS = [
  "https://cdn.shopify.com/videos/c/o/v/b8e9ae73e56d497d8f90e96f93178c96.mp4",
  "https://cdn.shopify.com/videos/c/o/v/0162644b22b0489f87fd1ec2bd40b968.mp4",
  "https://cdn.shopify.com/videos/c/o/v/d0e980aa0a7146309845b709397fb00e.mp4",
];
