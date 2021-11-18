import { useRouter } from "next/router";
import useAllPublicOpenings from "../../../SWR/useAllPublicOpenings";
import PublicOpeningsList from "../../Openings/Public/PublicOpeningsList";
export default function OrgApplyPageContent() {
  const router = useRouter();
  const { orgId }: Partial<CUSTOM_QUERY> = router.query;
  let { publicOpenings, isPublicOpeningsLoading, isPublicOpeningsError } =
    useAllPublicOpenings(orgId);

  return (
    <div className="mt-6">
      {publicOpenings?.length == 0 ? (
        <h1 className="text-xl font-semibold">
          There aren&apos;t any openings right now :(
        </h1>
      ) : (
        <PublicOpeningsList />
      )}
    </div>
  );
}
