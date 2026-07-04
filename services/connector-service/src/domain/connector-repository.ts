import type {
  Connector,
  ConnectorProps,
  ConnectorCategory,
} from "./connector.entity";

export interface ConnectorRepository {
  findById(id: string): Promise<Connector | null>;
  findByName(name: string): Promise<Connector | null>;
  findAll(category?: ConnectorCategory, search?: string): Promise<Connector[]>;
  findFeatured(): Promise<Connector[]>;
  create(
    props: Omit<ConnectorProps, "id" | "createdAt" | "updatedAt">,
  ): Promise<Connector>;
  update(id: string, data: Partial<ConnectorProps>): Promise<Connector>;
  delete(id: string): Promise<void>;
}
