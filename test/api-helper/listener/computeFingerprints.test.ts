/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { computeFingerprints } from "../../../lib/api-helper/listener/computeFingerprints";

import {
    InMemoryProject,
    InMemoryProjectFile,
    SimpleRepoId,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import { computeShaOf } from "../../../lib/api-helper/misc/sha";
import { PushImpactListenerInvocation } from "../../../lib/api/listener/PushImpactListener";
import { FingerprinterResult } from "../../../lib/api/registration/FingerprinterRegistration";
import { PushImpactListener } from "../../../lib/api/registration/PushImpactListenerRegistration";

const SomeFingerprinter: PushImpactListener<FingerprinterResult> = async pli => {
    return [];
};

describe("computeFingerprints", () => {

    it("should execute none", async () => {
        const cri: PushImpactListenerInvocation = null;
        const r = await computeFingerprints(cri, []);
        assert.equal(r.length, 0);
    });

    it("should execute one against empty project", async () => {
        const cri: PushImpactListenerInvocation = {project: InMemoryProject.of()} as any as PushImpactListenerInvocation;
        const r = await computeFingerprints(cri, [SomeFingerprinter]);
        assert.equal(r.length, 0);
    });

    it("should fingerprint with one", async () => {
        const cri: PushImpactListenerInvocation = {
            project: InMemoryProject.from(
                new SimpleRepoId("a", "b"),
                new InMemoryProjectFile("thing", "1")),
        } as any as PushImpactListenerInvocation;
        const r = await computeFingerprints(cri, [async i => ({
            name: "foo",
            data: i.project.id.owner,
            sha: computeShaOf(i.project.id.owner),
            abbreviation: "xkc",
            version: "1.0",
        })]);
        assert.equal(r.length, 1);
        assert.equal(r[0].data, "a");
    });

});
