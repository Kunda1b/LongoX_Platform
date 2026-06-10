import type {
  Listing,
  ListingProps,
  ListingType,
  ListingStatus,
} from "./listing.entity";

export interface ListingRepository {
  findById(id: number): Promise<Listing | null>;
  findAll(filters?: {
    type?: ListingType;
    category?: string;
    search?: string;
    status?: ListingStatus;
    featured?: boolean;
  }): Promise<Listing[]>;
  findFeatured(): Promise<Listing[]>;
  findByAuthor(authorId: number): Promise<Listing[]>;
  create(
    props: Omit<ListingProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Listing>;
  update(id: number, data: Partial<ListingProps>): Promise<Listing>;
  delete(id: number): Promise<void>;
}
