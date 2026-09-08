import { redirect } from "next/navigation";

export default function EditProfileRedirect() {
  redirect("/teacher/profile/settings");
}
