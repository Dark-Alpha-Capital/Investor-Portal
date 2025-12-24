// Server component wrapper - data is now fetched client-side via React Query
import { AdminsTableClient } from "./admins-table-client";

export async function AdminsTable() {
  return <AdminsTableClient />;
}
