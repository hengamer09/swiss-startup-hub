import { redirect } from "next/navigation";

// Discover has been merged into the Feed page.
export default function DiscoverPage() {
  redirect("/feed");
}
