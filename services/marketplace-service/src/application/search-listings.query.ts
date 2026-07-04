import type { ListingRepository } from "../domain/listing-repository";
import type { Listing, ListingType } from "../domain/listing.entity";
import { db, marketplaceListingsTable, marketplaceInstallsTable } from "@longox/db";
import { eq } from "drizzle-orm";

export interface SearchListingsInput {
  type?: ListingType;
  category?: string;
  search?: string;
  featured?: boolean;
  limit: number;
  offset: number;
}

export interface SearchListingsResult {
  listings: Listing[];
  total: number;
  limit: number;
  offset: number;
}

export class SearchListingsQuery {
  constructor(private repository: ListingRepository) {}

  async execute(input: SearchListingsInput): Promise<SearchListingsResult> {
    const listings = await this.repository.findAll({
      type: input.type,
      category: input.category,
      search: input.search,
      featured: input.featured,
    });

    const paginated = listings.slice(input.offset, input.offset + input.limit);

    return {
      listings: paginated,
      total: listings.length,
      limit: input.limit,
      offset: input.offset,
    };
  }
}

export interface InstallListingInput {
  listingId: string;
  tenantId: string;
  installedBy: number;
}

export class InstallListingCommand {
  constructor(private repository: ListingRepository) {}

  async execute(input: InstallListingInput): Promise<void> {
    const listing = await this.repository.findById(input.listingId);
    if (!listing) throw new Error("Listing not found");

    listing.recordInstall();
    await this.repository.update(input.listingId, {
      installCount: listing.installCount,
    } as any);

    await db.insert(marketplaceInstallsTable).values({
      listingId: input.listingId,
      tenantId: input.tenantId,
      installedBy: input.installedBy,
    });
  }
}
