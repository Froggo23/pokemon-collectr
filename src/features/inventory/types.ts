/** Owned inventory line — quantity of a catalog card. */
export interface InventoryLine {
  cardId: string
  quantity: number
}

export type Inventory = InventoryLine[]
