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

import * as stringify from "json-stringify-safe";

export function serializeResult(result: any): string {
    return stringify(result, replacer, 0);
}

const KeysToIgnore = ["childProcess"];

function replacer(key: string, value: any): any {
    if ((key === "request" || key === "response") && !!value && stringify(value).length > 200) {
        return `<...elided because it might be a really long axios ${key}...>`;
    } else if (!KeysToIgnore.includes(key)) {
        return value;
    }
    return undefined;
}
