import type {
  Connector,
  ConnectorProps,
  ConnectorCategory,
} from "./connector.entity";

export interface ConnectorRepository {
  findById(id: number): Promise<Connector | null>;
  findByName(name: string): Promise<Connector | null>;
  findAll(category?: ConnectorCategory, search?: string): Promise<Connector[]>;
  findFeatured(): Promise<Connector[]>;
  create(
    props: Omit<ConnectorProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Connector>;
  update(id: number, data: Partial<ConnectorProps>): Promise<Connector>;
  delete(id: number): Promise<void>;
}
