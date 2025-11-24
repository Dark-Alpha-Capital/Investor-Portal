import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";

const AdminPage = async () => {
  return (
    <div>
      <Suspense>
        <ListUsers />
      </Suspense>
    </div>
  );
};

export default AdminPage;

async function ListUsers() {
  const users = await auth.api.listUsers({
    query: {
      limit: 100,
      offset: 0,
    },
    // This endpoint requires session cookies.
    headers: await headers(),
  });
  return <div>{JSON.stringify(users)}</div>;
}
