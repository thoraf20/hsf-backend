import { Enquires, Enquiry, EnquiryMsg } from "@entities/Enquires";
import { IEnquiresRepository } from "@interfaces/IEnquiresRepository";
import db from "@infrastructure/database/knex";


export class EnquiryRepository implements IEnquiresRepository{
    private readonly tablename: string = "enquires";
    private readonly msgTablename: string = "enquires_message";

    async newMessageEnquiry(enquiry: Enquires, message: EnquiryMsg): Promise<Enquiry> {
        let newEnquiry = enquiry;
        
        if (enquiry.id == null){
            [newEnquiry] =await db(this.tablename).insert({
                ...enquiry,
                created_at: new Date(),
                updated_at: new Date()
            }).returning<Enquires[]>("*");
        }
        



        const messages = await db(this.msgTablename).insert({
            ...message,
            enquiry_id: newEnquiry.id,
            created_at: new Date(),
            updated_at: new Date()
        }).returning<any[]>("*").
        then((items) =>  items.map((item : any) => new EnquiryMsg(item)))
        return {...enquiry, messages }
    }

    async getAllUserEnquiries(user_id: string): Promise<Enquires[]> {
        const enquires = await db(this.tablename)
        .where({ customer_id: user_id }).or.where({ developer_id: user_id }) 
        .select("*");
        return enquires.map((enquiry: any) => new Enquires(enquiry) );
    }

    async getEnquiry(id: string): Promise<Enquiry> {
        const enquiry = await db(this.tablename)
        .where({ id  }) 
        .first("*").then(([ enq ]) => new Enquires(enq));

        let enquiryMessages: EnquiryMsg[];

        if (!enquiry){
            return;
        }

        enquiryMessages = await db(this.msgTablename)
        .where({ enquiry_id: id })
        .then((msgs: any[]) => msgs.map(msg => new EnquiryMsg(msg) ));

        return {...enquiry, messages: enquiryMessages};
    }
    
    async continueEnquiry(id: string, message: EnquiryMsg): Promise<Enquiry> {
        let enquiry = await db(this.tablename)
        .where({ id  }) 
        .first("*").then(([ enq ]) => new Enquires(enq));

        if (!enquiry){
            return;
        }
        if (enquiry.closed){
            const [updatedEnquiry] = await db(this.tablename)
            .where({ id })
            .update({ closed : false })
            .returning('*')

            enquiry = new Enquires(updatedEnquiry) ;
        }

        const messages = await db(this.msgTablename).insert({
            ...message,
            enquiry_id: enquiry.id,
            created_at: new Date(),
            updated_at: new Date()
        }).returning<any[]>("*").
        then((items) =>  items.map((item : any) => new EnquiryMsg(item)))
        return {...enquiry, messages }

    }

    async closeEnquiry(id: string): Promise<Enquires> {
        const [updatedEnquiry] = await db(this.tablename)
        .where({ id })
        .update({ closed : true })
        .returning('*')
      return updatedEnquiry ? new Enquires(updatedEnquiry) : null
    }

    async getUserEnquiryOfProduct(property_id: string, user_id: string): Promise<Enquiry> {
        let enquiry = await db(this.tablename)
        .where({ property_id  }).andWhere(builder => {
            builder.where({customer_id :  user_id}).orWhere({developer_id: user_id});
          })
        .first("*").then(([ enq ]) => new Enquires(enq));

        if (!enquiry){
            return;
        }

        const messages = await db(this.msgTablename)
        .where({ enquiry_id: enquiry.id })
        .then((msgs: any[]) => msgs.map(msg => new EnquiryMsg(msg) ));
        return {...enquiry, messages }
    }


}