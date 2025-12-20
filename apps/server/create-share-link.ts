import axios from "axios";

async function createShareLink(dealFolderPath: string) {
  const response = await axios({
    method: "post",
    url: `${process.env.NEXTCLOUD_URL}/ocs/v2.php/apps/files_sharing/api/v1/shares`,
    auth: {
      username: process.env.NEXTCLOUD_USER as string,
      password: process.env.NEXTCLOUD_PASSWORD as string,
    },
    headers: { "OCS-APIRequest": "true" },
    data: {
      path: dealFolderPath,
      shareType: 3, // 3 = Public Link
      permissions: 1, // 1 = Read Only (Essential for Investors!)
      password: "friendship@12345",
    },
  });

  // This URL is what you give to the investor
  return response.data.ocs.data.url;
}

(async () => {
  const shareLink = await createShareLink("/Deals/Project_Titan");
  console.log(shareLink);
})();
