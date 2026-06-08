import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedContent from "./FeedContent";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  return <FeedContent userId={session.user.id} />;
}
