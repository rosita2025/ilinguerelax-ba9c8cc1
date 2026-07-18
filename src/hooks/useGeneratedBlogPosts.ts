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
  related_products: string[] | null;
}

function toBlogPost(r: Row): BlogPost {
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
  };
}

export function useGeneratedBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("generated_blog_posts")
        .select("id,slug,title,excerpt,content,image,author,category,tags,read_time,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setPosts((data ?? []).map((r) => toBlogPost(r as Row)));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { posts, loading };
}

export async function fetchGeneratedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("generated_blog_posts")
    .select("id,slug,title,excerpt,content,image,author,category,tags,read_time,created_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? toBlogPost(data as Row) : null;
}
