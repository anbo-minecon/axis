import { db } from "../lib/db";
import { generateDeveloperToken } from "../lib/developer-auth";

async function retrieveDeveloper() {
  try {
    const developer = await db.usuario.findFirst({
      where: { rol: "DEVELOPER" },
      include: { developerCred: true },
    });

    if (!developer) {
      console.log("❌ No developer user found");
      process.exit(1);
    }

    console.log("✅ Developer User Found:");
    console.log("   Email: " + developer.email);
    console.log("   Name: " + developer.nombre);
    
    if (developer.developerCred) {
      console.log("   Token Secret: " + developer.developerCred.tokenSecret);
    }
    
    const token = generateDeveloperToken(developer.id);
    console.log("   Generated JWT Token: " + token);
    console.log("\n📝 Default Credentials:");
    console.log("   Email: developer@axis-preicfes.local");
    console.log("   Password: Developer@2025#Secure");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

retrieveDeveloper();
