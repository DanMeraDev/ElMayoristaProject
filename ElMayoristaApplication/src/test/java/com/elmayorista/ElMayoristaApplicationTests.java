package com.elmayorista;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = "spring.ai.vertex.ai.project-id=dummy-project-id")
@Disabled
class ElMayoristaApplicationTests {

	@Test
	void contextLoads() {
	}

}
