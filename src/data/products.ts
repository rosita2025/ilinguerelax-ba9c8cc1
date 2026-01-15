import product5000 from "@/assets/product-5000.png";
import product8000 from "@/assets/product-8000.png";
import productSpanish5000 from "@/assets/product-spanish-5000.png";
import product8000Book from "@/assets/product-8000-book.png";

export interface Product {
  id: string;
  slug: string;
  name: string;
  flag: string;
  country: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  badge: string;
  features: string[];
  isPhysical: boolean;
}

export const products: Product[] = [
  {
    id: "5000",
    slug: "5-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    name: "5,000 Palabras",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: product5000,
    title: "Inglés Relax - 5,000 Palabras",
    subtitle: "Nivel Básico a Intermedio",
    description: "Vocabulario esencial con pronunciación",
    rating: 4.8,
    reviews: 1247,
    price: 17.00,
    originalPrice: 54.00,
    discount: 67,
    badge: "Más Vendido",
    features: ["5,000 palabras", "4 Bonus gratis", "Acceso de por vida"],
    isPhysical: false,
  },
  {
    id: "8000",
    slug: "8-000-palabras-en-ingles-con-pronunciacion-espanol-y-fonetica-uk-usa",
    name: "8,000 Palabras",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: product8000,
    title: "Inglés Relax - 8,000 Palabras",
    subtitle: "Libro Digital Completo",
    description: "Vocabulario completo + gramática",
    rating: 4.9,
    reviews: 892,
    price: 24.00,
    originalPrice: 76.00,
    discount: 70,
    badge: "Premium",
    features: ["8,000 palabras", "Pronunciación español", "Fonética UK/USA"],
    isPhysical: false,
  },
  {
    id: "8000-book",
    slug: "8-000-palabras-libro-fisico",
    name: "8,000 Palabras Libro",
    flag: "🇬🇧",
    country: "Inglés UK / USA",
    image: product8000Book,
    title: "Inglés Relax - 8,000 Palabras",
    subtitle: "Libro Físico Tapa Blanda",
    description: "Libro físico tapa blanda premium",
    rating: 4.9,
    reviews: 800,
    price: 32.99,
    originalPrice: null,
    discount: null,
    badge: "📖 Libro Físico",
    features: ["Tapa blanda", "300-350 páginas", "Incluye PDF"],
    isPhysical: true,
  },
  {
    id: "spanish-5000",
    slug: "5-000-spanish-words-with-english-pronunciation",
    name: "5,000 Words",
    flag: "🇪🇸",
    country: "Spanish for English Speakers",
    image: productSpanish5000,
    title: "Spanish Relax - 5,000 Words",
    subtitle: "Spanish for English Speakers",
    description: "With English Pronunciation",
    rating: 4.8,
    reviews: 500,
    price: 17.00,
    originalPrice: 54.00,
    discount: 67,
    badge: "🆕 New",
    features: ["5,000 words", "English pronunciation", "For English speakers"],
    isPhysical: false,
  },
];

export const comingSoonLanguages = [
  { name: "Italiano", flag: "🇮🇹" },
  { name: "Portugués", flag: "🇧🇷" },
  { name: "Francés", flag: "🇫🇷" },
  { name: "Alemán", flag: "🇩🇪" },
  { name: "Japonés", flag: "🇯🇵" },
  { name: "Chino", flag: "🇨🇳" },
  { name: "Coreano", flag: "🇰🇷" },
  { name: "Ruso", flag: "🇷🇺" },
  { name: "Árabe", flag: "🇸🇦" },
  { name: "Hindi", flag: "🇮🇳" },
];

// Helper to get product link
export const getProductLink = (product: Product) => `/products/${product.slug}`;

// Helper to get product by slug
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);

// Helper to get product by id
export const getProductById = (id: string) => products.find(p => p.id === id);
