"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchForm } from "@/components/searches/SearchForm";
import { useCreateSearch } from "@/hooks/useSearches";

export default function NewSearchPage() {
  const router = useRouter();
  const createSearch = useCreateSearch();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">New search</h1>
      <SearchForm
        submitLabel="Create search"
        onSubmit={async (values) => {
          await createSearch.mutateAsync(values);
          toast.success("Search created");
          router.push("/searches");
        }}
      />
    </div>
  );
}
