import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/data/blogPosts";

interface Row {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  category: string;
  tags: string[] | null;
  read_time: string;
  created_at: string;
  updated_at: string;
  related_products: string[] | null;
}

function toBlogPost(r: Row): BlogPost & { updatedAt?: string } {
  return {
    id: `gen-${r.id}`,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    image: r.image,
    author: r.author,
    date: r.created_at.slice(0, 10),
    readTime: r.read_time,
    category: r.category,
    tags: r.tags ?? [],
    relatedProducts: r.related_products ?? [],
    updatedAt: r.updated_at,
  };
}

const COLS = "id,slug,title,excerpt,content,image,author,category,tags,read_time,created_at,updated_at,related_products";

export function useGeneratedBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("generated_blog_posts")
          .select(COLS)
          .eq("published", true)
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching blog posts:", error);
          if (!cancelled) setLoading(false);
          return;
        }
        
        if (!cancelled) {
          setPosts((data ?? []).map((r) => toBlogPost(r as Row)));
          setLoading(false);
        }
      } catch (err) {
        console.error("useGeneratedBlogPosts catch error:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { posts, loading };
}

export async function fetchGeneratedBlogPostBySlug(slug: string): Promise<(BlogPost & { updatedAt?: string }) | null> {
  try {
    const { data, error } = await supabase
      .from("generated_blog_posts")
      .select(COLS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching post by slug (${slug}):`, error);
      return null;
    }
    return data ? toBlogPost(data as Row) : null;
  } catch (err) {
    console.error("fetchGeneratedBlogPostBySlug catch error:", err);
    return null;
  }
}

export async function fetchGeneratedBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from("generated_blog_posts")
      .select(COLS)
      .eq("published", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("fetchGeneratedBlogPosts error:", error);
      return [];
    }
    return (data ?? []).map((r) => toBlogPost(r as Row));
  } catch (err) {
    console.error("fetchGeneratedBlogPosts catch error:", err);
    return [];
  }
}

