import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImpressionAes from "./ImpressionAes";

// Page d'impression : sans menu latéral
export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <ImpressionAes />;
}
