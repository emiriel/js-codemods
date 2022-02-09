import {
  mustReplaceId1,
  mustReplaceId2,
  replaceOnlyImport1,
  dontReplace1,
} from "mustReplaceLib";
import {
  mustReplaceId1 as dontReplace2,
  replaceOnlyImport2,
} from "mustReplaceLib2";

function testFun(arg) {
  const replaceOnlyImport2 = 10;
  const { replaceOnlyImport1 } = arg;
  return 2 + replaceOnlyImport2 + mustReplaceId2 + dontReplace1;
}

function testFun2(arg) {
  const valueFromImport = mustReplaceId1;
  const {
    replaceOnlyImport1: { replaceOnlyImport2 },
  } = arg;
  let i = 0;
  for (i = 0; i < 10; i++) {
    console.log(replaceOnlyImport1, replaceOnlyImport2, mustReplaceId1);
  }
  return (
    replaceOnlyImport1 + replaceOnlyImport2 + mustReplaceId1 + dontReplace2
  );
}

export {
  testFun,
  testFun2 as replaceOnlyImport1,
  mustReplaceId1,
  mustReplaceId2 as replaceOnlyImport2,
};
