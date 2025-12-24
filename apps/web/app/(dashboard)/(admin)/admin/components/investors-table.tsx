// Server component wrapper - data is now fetched client-side via React Query
import { InvestorsTableClient } from "./investors-table-client";

export async function InvestorsTable() {
  return <InvestorsTableClient />;
}
