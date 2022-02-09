import {
  REP_1,
  REP_2,
  REP_IMP_1,
  dontReplace1,
} from "REP_LIB_1";
import {
  REP_1 as dontReplace2,
  REP_IMP_2,
} from "REP_LIB_2";

function testFun(arg) {
  const replaceOnlyImport2 = 10;
  const { replaceOnlyImport1 } = arg;
  return 2 + replaceOnlyImport2 + REP_2 + dontReplace1;
}

function testFun2(arg) {
  const valueFromImport = REP_1;
  const {
    replaceOnlyImport1: { replaceOnlyImport2 },
  } = arg;
  let i = 0;
  for (i = 0; i < 10; i++) {
    console.log(replaceOnlyImport1, replaceOnlyImport2, REP_1);
  }
  return replaceOnlyImport1 + replaceOnlyImport2 + REP_1 + dontReplace2;
}

export {
  testFun,
  testFun2 as replaceOnlyImport1,
  REP_1,
  REP_2 as replaceOnlyImport2,
};
