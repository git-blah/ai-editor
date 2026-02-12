const projectIdPage = async ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = await params;

  return (
    <>
      <div>This is the custom page : {projectId} </div>
    </>
  );
};

export default projectIdPage;
