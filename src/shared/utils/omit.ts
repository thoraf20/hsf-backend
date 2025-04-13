export default function (record: Record<any, any>, items: any[]) {
    return Object.fromEntries(
        Object.entries(record).filter(([k, _]) => !items.includes(k))  
      );
}