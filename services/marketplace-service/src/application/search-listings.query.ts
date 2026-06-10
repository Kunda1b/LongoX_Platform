import type { ListingRepository } from "../domain";
import type { Listing, ListingType, ListingStatus } from "../domain";

export interface SearchListingsInput {
  type?: ListingType;
  category?: string;
  search?: string;
  status?: ListingStatus;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export class SearchListingsQuery {
  constructor(private repository: ListingRepository) {}

  async execute(input: SearchListingsInput): Promise<{ items: Listing[]; total: number }> {
    const items = await this.repository.findAll({
      type: input.type,
      category: input.category,
      search: input.search,
      status: input.status,
      featured: input.featured,
    });

    const offset = input.offset ?? 0;
    const limit = input.limit ?? 50;
    const paginated = items.slice(offset, offset + limit);

    return { items: paginated, total: items.length };
  }
}

export interface InstallListingInput {
  listingId: number;
  tenantId: number;
  installedBy: number;
}

export class InstallListingCommand {
  constructor(private repository: ListingRepository) {}

  async execute(input: InstallListingInput): Promise<void> {
    const listing = await this.repository.findById(input.listingId);
    if (!listing) throw new Error(`Listing ${input.listingId} not found`);
    if (listing.status !== "published") throw new Error(`Listing ${input.listingId} is not published`);

    listing.recordInstall();
    await this.repository.update(input.listingId, { installCount: listing.installCount });
  }
}
