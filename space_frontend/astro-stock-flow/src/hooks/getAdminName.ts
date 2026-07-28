import { BASE_URL } from "@/hooks/baseUrls";
export const AdminDetails = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BASE_URL}/admin-users/get-admin-user/${id}/${token}`
    );
    const data = await res.json();
    const name = data.username;
    return name;
  } catch (e) {
    console.error(e);
    return "";
  }
};
