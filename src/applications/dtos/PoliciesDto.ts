
export class PoliciesDto {
    clientId: string;
    policies: Policy[];
}

export class Policy {
    actions: string[];
    resources: Resource[];
}

export class Resource {
    mission_database_id: string;
    data?: any;
}

