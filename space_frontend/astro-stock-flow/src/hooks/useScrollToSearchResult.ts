// hooks/useScrollToSearchResult.ts
import { useEffect, useRef, useState } from "react";

export function useScrollToSearchResult(searchResult: any, data: any[]) {
  const rowRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (searchResult && data.length > 0 && !hasScrolled) {
      const itemId = searchResult.id;
      const item = data.find((item) => item.id === itemId);

      if (item) {
        setTimeout(() => {
          const rowElement = rowRefs.current[itemId];
          if (rowElement) {
            rowElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            rowElement.classList.add("highlight-search-result");
            setTimeout(() => {
              rowElement.classList.remove("highlight-search-result");
            }, 3000);
          }
        }, 100);

        setHasScrolled(true);
      }
    }
  }, [data, searchResult, hasScrolled]);

  return { rowRefs, hasScrolled };
}
