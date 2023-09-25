import React, { Dispatch, SetStateAction, useState } from "react";
import { ISpace, useSpace } from "@flatfile/react";
import { workbook } from "./workbook";

const spaceProps: ISpace = {
  name: "Embedded Space",
  publishableKey: "pk_2ed8c72042784e9c8deceb7bbd370aea",
  environmentId: "us_env_l09LN6DV",
};

const Space = ({
  setShowSpace,
}: {
  setShowSpace: Dispatch<SetStateAction<boolean>>;
}) => {
  const space = useSpace({
    ...spaceProps,
    workbook,
    sidebarConfig: {
      showSidebar: false,
    },
    themeConfig: {
      root: {
        primaryColor: "blue",
      },
      sidebar: {
        logo: "https://images.ctfassets.net/hjneo4qi4goj/gL6Blz3kTPdZXWknuIDVx/7bb7c73d93b111ed542d2ed426b42fd5/flatfile.svg",
      },
    },
    closeSpace: {
      operation: "equipmentList:submit",
      onClose: () => setShowSpace(false),
    },
  });
  return space;
};

export default function App() {
  const [showSpace, setShowSpace] = useState(false);

  return (
    <div className="content">
      <h2>
        <code>&lt;Flatfile /&gt;</code>
      </h2>
      <p>Embed Flatfile in just a few lines of code.</p>
      {/*Button to trigger the modal */}
      <div>
        <button
          className="contrast"
          onClick={() => {
            setShowSpace(!showSpace);
          }}
        >
          {showSpace === true ? "Close" : "Open and create new"} Space
        </button>
        {showSpace && <Space setShowSpace={setShowSpace} />}
      </div>
    </div>
  );
}
