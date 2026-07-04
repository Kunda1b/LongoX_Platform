export interface ReviewProps {
  id: string;
  listingId: string;
  tenantId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Review {
  constructor(private props: ReviewProps) {}

  get id(): number {
    return this.props.id;
  }
  get listingId(): number {
    return this.props.listingId;
  }
  get rating(): number {
    return this.props.rating;
  }
  get verified(): boolean {
    return this.props.verified;
  }

  toJSON() {
    return { ...this.props };
  }
}
