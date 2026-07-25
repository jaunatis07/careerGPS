import { redirect } from "next/navigation";

/** /resume → /resume-agent 别名，便于记忆与分享。 */
export default function ResumeAliasPage() {
  redirect("/resume-agent");
}
