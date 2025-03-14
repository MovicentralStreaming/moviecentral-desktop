import { MovieItem } from "../types/types";
import { MovieItemComponent } from "./MovieItemComponent";

export function MovieItemGrid({ items }: { items: MovieItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 ? (
        <div className="movieGrid">
          {items.map((item) => (
            <MovieItemComponent key={item.id} item={item}></MovieItemComponent>
          ))}
        </div>
      ) : (
        <span>No Results...</span>
      )}
    </div>
  );
}
