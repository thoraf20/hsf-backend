import { Lender, LenderProfile } from "@entities/Leader";

export interface ILenderRepository {
    createLender(lender: Lender): Promise<LenderProfile>;
    getLenderById(id: string): Promise<Lender | null>;
    getAllLenders(): Promise<Lender[]>;
    updateLender(id: string, lender: Partial<Lender>): Promise<Lender | null>;
    deleteLender(id: string): Promise<void>;
    findLenderByName(lender_name: string): Promise<Lender | null>;
    findLenderByCac(cac: string): Promise<Lender | null>;
}