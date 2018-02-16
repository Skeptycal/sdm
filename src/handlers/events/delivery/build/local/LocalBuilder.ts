import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios from "axios";
import { postLinkImageWebhook } from "../../../link/ImageLink";
import { ArtifactStore } from "../../ArtifactStore";
import { Builder } from "../../Builder";
import { LinkableLogFactory, LinkablePersistentProgressLog, ProgressLog } from "../../log/ProgressLog";
import { AppInfo } from "../../Deployment";
import { Readable } from "stream";
import EventEmitter = NodeJS.EventEmitter;

export interface LocalBuildInProgress {

    readonly stream: EventEmitter;

    readonly repoRef: RemoteRepoRef;

    readonly team: string;

    /** Available once build is complete */
    readonly appInfo: AppInfo;

    readonly deploymentUnitStream: Readable;

    readonly deploymentUnitFile: string;

    readonly url: string;
}

/**
 * Superclass for build implemented on the automation client itself, emitting appropriate events to Atomist.
 * Allows listening to a Running build
 */
export abstract class LocalBuilder implements Builder {

    constructor(private artifactStore: ArtifactStore,
                private logFactory: LinkableLogFactory) {
    }

    public async initiateBuild(creds: ProjectOperationCredentials, id: RemoteRepoRef,
                               team: string): Promise<LocalBuildInProgress> {
        const as = this.artifactStore;
        const log = await this.logFactory();

        const rb = await this.startBuild(creds, id, team, log);
        rb.stream.addListener("exit", (code, signal) => onExit(code === 0, rb, team, as, log))
            .addListener("error", (code, signal) => onExit(false, rb, team, as, log));
        await onStarted(rb);
        return rb;
    }

    protected abstract startBuild(creds: ProjectOperationCredentials, id: RemoteRepoRef,
                                  team: string, log: LinkablePersistentProgressLog): Promise<LocalBuildInProgress>;
}

function onStarted(runningBuild: LocalBuildInProgress) {
    return updateAtomistLifecycle(runningBuild, "STARTED", "STARTED");
}

function updateAtomistLifecycle(runningBuild: LocalBuildInProgress,
                                status: "STARTED" | "SUCCESS" | "FAILURE",
                                phase: "STARTED" | "FINALIZED" = "FINALIZED"): Promise<LocalBuildInProgress> {
    // TODO Use David's Abstraction?
    const url = `https://webhook.atomist.com/atomist/jenkins/teams/${runningBuild.team}`;
    const data = {
        name: `Build ${runningBuild.repoRef.sha}`,
        duration: 3,
        build: {
            number: `Build ${runningBuild.repoRef.sha.substring(0, 7)}...`,
            scm: {
                commit: runningBuild.repoRef.sha,
                // TODO why doesn't this work
                // url: runningBuild.url,
                url: `https://github.com/${runningBuild.repoRef.owner}/${runningBuild.repoRef.repo}`,
                // TODO is this required
                branch: "master",
            },
            phase,
            status,
            full_url: `https://github.com/${runningBuild.repoRef.owner}/${runningBuild.repoRef.repo}/commit/${runningBuild.repoRef.sha}`,
        },
    };
    return axios.post(url, data)
        .then(() => runningBuild);
}

async function onExit(success: boolean,
                      rb: LocalBuildInProgress, team: string,
                      artifactStore: ArtifactStore,
                      log: ProgressLog): Promise<any> {
    try {
        if (success) {
            await updateAtomistLifecycle(rb, "SUCCESS", "FINALIZED")
                .then(id => linkArtifact(rb, team, artifactStore));
        } else {
            await updateAtomistLifecycle(rb, "FAILURE", "FINALIZED");
        }
    } finally {
        await log.close();
    }
}

function linkArtifact(rb: LocalBuildInProgress, team: string, artifactStore: ArtifactStore): Promise<any> {
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile)
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}
