/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "mocha";
import { TruePushTest } from "./pushTestUtilsTest";
import { PushRules } from "../../../../src/common/listener/support/PushRules";
import * as assert from "power-assert";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { PushTest, pushTest } from "../../../../src/common/listener/PushTest";

export const UndefinedPushTest: PushTest = pushTest("true", async () => undefined);
export const NullPushTest: PushTest = pushTest("true", async () => null);


describe("PushRules", () => {

    it("should match one", async () => {
        const pm = TruePushTest;
        const pr = new PushRules("", [pm]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === true);
    });

    it("should not match undefined", async () => {
        const pr = new PushRules("", [UndefinedPushTest]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === undefined);
    });

    it("should match undefined and one", async () => {
        const pm = TruePushTest;
        const pr = new PushRules("", [UndefinedPushTest, pm]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === true);
    });

    it("should return undefined on null and one", async () => {
        const pm = TruePushTest;
        const pr = new PushRules("", [NullPushTest, pm]);
        assert(await pr.valueForPush({id: new GitHubRepoRef("a", "b")} as any) === undefined);
    });

});