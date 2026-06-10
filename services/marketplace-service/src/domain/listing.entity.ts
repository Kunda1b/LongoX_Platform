export type ListingType = "connector" | "template" | "bundle";
export type ListingStatus =
  | "published"
  | "draft"
  | "archived"
  | "pending_review";

export interface ListingProps {
  id: number;
  title: string;
  description: string;
  listingType: ListingType;
  category: string;
  tags: string[];
  author: string;
  authorId: number;
  version: string;
  icon?: string;
  screenshots?: string[];
  documentationUrl?: string;
  sourceUrl?: string;
  status: ListingStatus;
  installCount: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  verified: boolean;
  pricing: { free: boolean; price?: number; tier?: string };
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Listing {
  constructor(private props: ListingProps) {}

  get id(): number {
    return this.props.id;
  }
  get title(): string {
    return this.props.title;
  }
  get listingType(): ListingType {
    return this.props.listingType;
  }
  get status(): ListingStatus {
    return this.props.status;
  }
  get rating(): number {
    return this.props.rating;
  }
  get installCount(): number {
    return this.props.installCount;
  }
  get featured(): boolean {
    return this.props.featured;
  }
  get verified(): boolean {
    return this.props.verified;
  }

  publish(): void {
    this.props.status = "published";
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.status = "archived";
    this.props.updatedAt = new Date();
  }

  recordInstall(): void {
    this.props.installCount += 1;
    this.props.updatedAt = new Date();
  }

  updateRating(newRating: number): void {
    this.props.rating = newRating;
    this.props.reviewCount += 1;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
