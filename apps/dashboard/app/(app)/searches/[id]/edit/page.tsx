"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchForm } from "@/components/searches/SearchForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useSearches, useUpdateSearch } from "@/hooks/useSearches";

export default function EditSearchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  // No GET /searches/:id endpoint exists — the list (already cached from /searches) is the
  // source of truth here, matched by id.
  const { data: searches, isLoading, isError, refetch } = useSearches();
  const updateSearch = useUpdateSearch();

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const search = searches?.find((item) => item.id === params.id);
  if (!search) {
    return <ErrorState message="Search not found." />;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">
        Edit &ldquo;{search.name}&rdquo;
      </h1>
      <SearchForm
        submitLabel="Save changes"
        initialValues={{
          name: search.name,
          brands: search.brands,
          categories: search.categories,
          sizes: search.sizes,
          keywords: search.keywords,
          excludedKeywords: search.excludedKeywords,
          minPrice: search.minPrice != null ? String(search.minPrice) : "",
          maxPrice: search.maxPrice != null ? String(search.maxPrice) : "",
          minimumScore: search.minimumScore,
          frequency: search.frequency,
          enabled: search.enabled,
        }}
        onSubmit={async (values) => {
          await updateSearch.mutateAsync({ id: search.id, input: values });
          toast.success("Search updated");
          router.push("/searches");
        }}
      />
    </div>
  );
}
